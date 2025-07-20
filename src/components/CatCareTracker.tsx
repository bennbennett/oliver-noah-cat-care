import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, User, Heart, Edit } from 'lucide-react';
import { format, isToday, parseISO, isWithinInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CheckIn {
  date: string;
  caregiver: 'oliver' | 'noah' | 'stacey';
  timestamp: string;
}

const CatCareTracker = () => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [todayCheckedIn, setTodayCheckedIn] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null);
  const [newCaregiver, setNewCaregiver] = useState<'oliver' | 'noah' | 'stacey'>('oliver');
  const { toast } = useToast();

  // Date range for cat care (July 20, 2025 - August 6, 2025)
  const startDate = '2025-07-20';
  const endDate = '2025-08-06';
  const payPerDay = 20;

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCheckIns = localStorage.getItem('catCareCheckIns');
    if (savedCheckIns) {
      const parsed = JSON.parse(savedCheckIns);
      setCheckIns(parsed);
      
      // Check if someone already checked in today
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayCheckIn = parsed.find((checkIn: CheckIn) => checkIn.date === today);
      if (todayCheckIn) {
        setTodayCheckedIn(todayCheckIn.caregiver);
      }
    }
  }, []);

  // Save to localStorage whenever checkIns change
  useEffect(() => {
    localStorage.setItem('catCareCheckIns', JSON.stringify(checkIns));
  }, [checkIns]);

  const handleCheckIn = (caregiver: 'oliver' | 'noah' | 'stacey') => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    if (todayCheckedIn) {
      toast({
        title: "Already checked in today!",
        description: `${todayCheckedIn === 'oliver' ? 'Oliver' : todayCheckedIn === 'noah' ? 'Noah' : 'Stacey'} already checked in for today.`,
        variant: "destructive",
      });
      return;
    }

    const newCheckIn: CheckIn = {
      date: today,
      caregiver,
      timestamp: new Date().toISOString(),
    };

    setCheckIns(prev => [...prev, newCheckIn]);
    setTodayCheckedIn(caregiver);

    toast({
      title: "Check-in successful! 🐱",
      description: `${caregiver === 'oliver' ? 'Oliver' : caregiver === 'noah' ? 'Noah' : 'Stacey'} checked in for today. Great job taking care of Jupi!`,
    });
  };

  const getEarnings = (caregiver: 'oliver' | 'noah' | 'stacey') => {
    return checkIns.filter(checkIn => checkIn.caregiver === caregiver).length * payPerDay;
  };

  const getRecentCheckIns = () => {
    return checkIns
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingCheckIn = checkIns.find(checkIn => checkIn.date === dateStr);
    
    setSelectedDate(date);
    setEditingCheckIn(existingCheckIn || null);
    setNewCaregiver(existingCheckIn?.caregiver || 'oliver');
    setShowCalendar(true);
  };

  const handleSaveCheckIn = () => {
    if (!selectedDate) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Check if date is within allowed range
    const isInRange = isWithinInterval(selectedDate, {
      start: parseISO(startDate),
      end: parseISO(endDate)
    });
    
    if (!isInRange) {
      toast({
        title: "Invalid date",
        description: "Please select a date within the care period (July 20 - August 6, 2025).",
        variant: "destructive",
      });
      return;
    }
    
    if (editingCheckIn) {
      // Update existing check-in
      setCheckIns(prev => prev.map(checkIn => 
        checkIn.date === dateStr 
          ? { ...checkIn, caregiver: newCaregiver }
          : checkIn
      ));
      toast({
        title: "Check-in updated!",
        description: `Changed caregiver to ${newCaregiver === 'oliver' ? 'Oliver' : newCaregiver === 'noah' ? 'Noah' : 'Stacey'} for ${format(selectedDate, 'MMM d, yyyy')}.`,
      });
    } else {
      // Add new check-in
      const newCheckIn: CheckIn = {
        date: dateStr,
        caregiver: newCaregiver,
        timestamp: new Date().toISOString(),
      };
      setCheckIns(prev => [...prev, newCheckIn]);
      toast({
        title: "Check-in added!",
        description: `Added ${newCaregiver === 'oliver' ? 'Oliver' : newCaregiver === 'noah' ? 'Noah' : 'Stacey'} for ${format(selectedDate, 'MMM d, yyyy')}.`,
      });
    }
    
    // Update today's check-in if editing today
    const today = format(new Date(), 'yyyy-MM-dd');
    if (dateStr === today) {
      setTodayCheckedIn(newCaregiver);
    }
    
    setShowCalendar(false);
    setSelectedDate(undefined);
    setEditingCheckIn(null);
  };

  const handleDeleteCheckIn = () => {
    if (!selectedDate) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    setCheckIns(prev => prev.filter(checkIn => checkIn.date !== dateStr));
    
    // Update today's check-in if deleting today
    const today = format(new Date(), 'yyyy-MM-dd');
    if (dateStr === today) {
      setTodayCheckedIn(null);
    }
    
    toast({
      title: "Check-in deleted",
      description: `Removed check-in for ${format(selectedDate, 'MMM d, yyyy')}.`,
    });
    
    setShowCalendar(false);
    setSelectedDate(undefined);
    setEditingCheckIn(null);
  };

  const getCheckInDates = () => {
    return checkIns.map(checkIn => parseISO(checkIn.date));
  };

  const getDayModifiers = () => {
    const checkInDates = getCheckInDates();
    return {
      hasCheckIn: checkInDates,
    };
  };

  const getDayModifiersClassNames = () => {
    return {
      hasCheckIn: 'bg-primary/20 text-primary font-semibold',
    };
  };

  const today = format(new Date(), 'EEEE, MMMM do, yyyy');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-cat-cream p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground">
            <Heart className="h-6 w-6 text-primary" />
            <span>Jupi's Care Log</span>
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">
            {today}
          </p>
        </div>

        {/* Today's Check-in */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Today's Check-in
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayCheckedIn ? (
              <div className="text-center space-y-3">
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  ✅ {todayCheckedIn === 'oliver' ? 'Oliver' : todayCheckedIn === 'noah' ? 'Noah' : 'Stacey'} checked in today!
                </Badge>
                <p className="text-muted-foreground text-sm">
                  Thanks for taking great care of Jupi! 🐾
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const today = format(new Date(), 'yyyy-MM-dd');
                    setCheckIns(prev => prev.filter(checkIn => checkIn.date !== today));
                    setTodayCheckedIn(null);
                    toast({
                      title: "Check-in reset",
                      description: "You can now select a different caregiver for today.",
                    });
                  }}
                  className="text-xs"
                >
                  Change Caregiver
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-muted-foreground text-sm">
                  Who's taking care of Jupi today?
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    variant="oliver" 
                    size="lg"
                    onClick={() => handleCheckIn('oliver')}
                    className="h-16 text-lg font-semibold"
                  >
                    <User className="h-5 w-5" />
                    Oliver
                  </Button>
                  <Button 
                    variant="noah" 
                    size="lg"
                    onClick={() => handleCheckIn('noah')}
                    className="h-16 text-lg font-semibold"
                  >
                    <User className="h-5 w-5" />
                    Noah
                  </Button>
                  <Button 
                    variant="stacey" 
                    size="lg"
                    onClick={() => handleCheckIn('stacey')}
                    className="h-16 text-lg font-semibold"
                  >
                    <User className="h-5 w-5" />
                    Stacey
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earnings Tally */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Earnings Tally
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-cat-orange">
                  ${getEarnings('oliver')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Oliver
                </div>
                <div className="text-xs text-muted-foreground">
                  {checkIns.filter(c => c.caregiver === 'oliver').length} days
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-accent">
                  ${getEarnings('noah')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Noah
                </div>
                <div className="text-xs text-muted-foreground">
                  {checkIns.filter(c => c.caregiver === 'noah').length} days
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-cat-purple">
                  ${getEarnings('stacey')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Stacey
                </div>
                <div className="text-xs text-muted-foreground">
                  {checkIns.filter(c => c.caregiver === 'stacey').length} days
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Management */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Edit className="h-5 w-5" />
              Manage Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar & Edit Check-ins
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingCheckIn ? 'Edit Check-in' : 'Add Check-in'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      modifiers={getDayModifiers()}
                      modifiersClassNames={getDayModifiersClassNames()}
                      className="rounded-md border pointer-events-auto"
                      disabled={(date) => 
                        !isWithinInterval(date, {
                          start: parseISO(startDate),
                          end: parseISO(endDate)
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Highlighted dates have check-ins. Click any date to add/edit.
                    </p>
                  </div>
                  
                  {selectedDate && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="text-sm font-medium">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Caregiver:</label>
                        <Select value={newCaregiver} onValueChange={(value: 'oliver' | 'noah' | 'stacey') => setNewCaregiver(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oliver">Oliver</SelectItem>
                            <SelectItem value="noah">Noah</SelectItem>
                            <SelectItem value="stacey">Stacey</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSaveCheckIn} className="flex-1">
                          {editingCheckIn ? 'Update' : 'Add'} Check-in
                        </Button>
                        {editingCheckIn && (
                          <Button variant="destructive" onClick={handleDeleteCheckIn}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        {checkIns.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getRecentCheckIns().map((checkIn, index) => (
                  <div 
                    key={`${checkIn.date}-${checkIn.caregiver}`}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        checkIn.caregiver === 'oliver' ? 'bg-cat-orange' : 
                        checkIn.caregiver === 'noah' ? 'bg-accent' : 'bg-cat-purple'
                      }`} />
                      <span className="font-medium">
                        {checkIn.caregiver === 'oliver' ? 'Oliver' : 
                         checkIn.caregiver === 'noah' ? 'Noah' : 'Stacey'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(checkIn.date), 'MMM d')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Period Info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>Care period: July 20 - August 6, 2025</p>
          <p>Rate: $20 per day</p>
        </div>
      </div>
    </div>
  );
};

export default CatCareTracker;